import { Component, OnInit, TemplateRef } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
import { getDatabase, ref, set } from 'firebase/database';
// Importar o Modal do Bootstrap
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule,],
  templateUrl: './operador.component.html',
  styleUrl: './operador.component.scss',
  providers:[BsModalRef, BsModalService]
})
export class OperadorComponent implements OnInit {
  operador: string ='';
  guiche: string = '';
  setor: string ='';
  senhaOperadorPainel: DadosSenha = new DadosSenha;
  senhaPreferencial: DadosSenha []= [];
  senhaNormal: DadosSenha = new DadosSenha;
  senhaNormalNova: DadosSenha[] = [];
  senhaPainel: DadosSenha[] =[];
  repetirSenha: DadosSenha []= [];
  senhaFinalizar: DadosSenha = new DadosSenha;
  telaoperador:boolean = false;
  telalogin:boolean = true;
  mostrarSenhas: boolean = false; // Controla a exibição das senhas não atendidas
  
  // Array para armazenar as senhas geradas
  senhasPreferenciais: DadosSenha[] = [];
  senhasNaoPreferenciais: DadosSenha[] = [];
  
  //VARIÁVEL QUE CRIA FORMULARIO

   formulario!: FormGroup;

   senha: DadosSenha [] = [];
   senhaVerificar: DadosSenha[] =[];

   modalRef?: BsModalRef;

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private modalService: BsModalService,
    private router: Router,
  ) {}


  ngOnInit(): void {
    this.formbuilder()
    
    // Obtém as senhas geradas do serviço AdminService
    /*this.adminService.getSenhasGeradas().subscribe(d => {
      console.log(d.length);
      this.senha = d;
     
       // Filtra senhas do operador atual
      this.senhaVerificar = this.senha.filter(s => s.operador === this.operador);
        
     
    });*/
   
    
     // Obtém senhas convencionais e organiza em preferencial e normal
    this.adminService.getSenhaGeradaConvencional().subscribe(d =>{
      console.log(d.length);
      this.repetirSenha = d;
      this.senhaNormalNova = [];
      this.senhaPreferencial = [];
        for (let index = 0; index < d.length; index++) {
        
          if (d[index].preferencial == true && d[index].status == '0'){
            this.senhaPreferencial.push(d[index]);
           
          }else if(d[index].status == '0') {
            this.senhaNormalNova.push(d[index]);
           
          }
        
        }
        console.log(this.senhaNormalNova);
        console.log(this.senhaPreferencial);
    })

    // Obtém senhas do painel convencional
    this.adminService.getSenhaPainelConvencional().subscribe(async d =>{
       this.senhaPainel = d
    })
  }

  
 

  // Criação do formulário de login do operador
  formbuilder(){
    this.formulario = this.formBuilder.group({
      guiche: ['',[Validators.required, Validators.minLength(5)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

  
  // Função para gerar uma nova senha
  novasenha() {}
  
   // Repete a chamada de uma senha no painel
  async repetirsenha(senha:DadosSenha) {
    // console.log(senha);
    this.spinner.show();
     for (let index = 0; index < this.senhaPainel.length; index++) {
       if( senha.senhaid === this.senhaPainel[index].senhaid ){
         this.senhaPainel[index].status = '1'
       await  this.adminService.updateSenhaChamada(this.senhaPainel[index].horachamada, this.senhaPainel[index]).then(async d => {
           console.log(d);
           await delay(2000);
           this.spinner.hide();
         })
       } 
     }
      this.spinner.hide();
    
         
   }

 // Repete a chamada de uma senha convencional  
 async repetirSenhaConvencional(senha:DadosSenha) {
  this.spinner.show();  
   console.log(senha);
    let senhaRepetida: DadosSenha = senha; 
   
    for (let index = 0; index < this.senhaPainel.length; index++) {
      if( senha.senhaid === this.senhaPainel[index].senhaid ){
        this.senhaPainel[index].status = '1'
      await  this.adminService.deleteSenhaChamadaConvencional(this.senhaPainel[index].horachamada).then( async d => {
    
           if(senhaRepetida.preferencial) {
                  this.senhaPreferencial[0] = senhaRepetida;
                  this.chamarsenhapreferencial().then(async d => {
                    await delay(4000);
                    this.spinner.hide();
                  });    
            } else {
                  this.senhaNormalNova[0] = senhaRepetida;
                  this.chamarSenhaNormalConvencional().then(async d =>{
                    await delay(4000);
                    this.spinner.hide();
                  })
            }
    
      }); 
      
      } 
    }
     this.spinner.hide();
     console.log(senhaRepetida);
        
  }


   // Chama uma senha normal no painel
  async chamarsenhanormal(senha:DadosSenha) {
    this.spinner.show();
    let time = Date.now().toString();
    console.log(senha);
    console.log(senha.operador);
    senha.status ='1';
    senha.horachamada = time;
    console.log(senha);
    await this.adminService.salvaSenhaChamada(senha)
    await this.adminService.updateSenha(senha.senhaid, senha).then( d=> {
       this.spinner.hide();
    })
  }
  
  // Chama uma senha normal convencional
  async chamarSenhaNormalConvencional(senhaSelecionada?: DadosSenha) {
    this.spinner.show();
    let time = Date.now().toString();
  
    // Usar a senha passada ou a primeira da lista (funcionalidade original)
    const senha = senhaSelecionada || this.senhaNormalNova[0];
  
    senha.operador = this.operador;
    senha.guiche = this.guiche;
    senha.status = '1';
    senha.horachamada = time;
    this.senhaOperadorPainel = senha;
  
    try {
      await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
      await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);
      console.log("Senha chamada:", senha);
    } catch (error) {
      console.error("Erro ao chamar senha normal:", error);
    } finally {
      this.spinner.hide();
    }
  }
 
  // Chama uma senha preferencial convencional
  async chamarsenhapreferencial(senhaSelecionada?: DadosSenha) {
    this.spinner.show();
    let time = Date.now().toString();
  
    // Usar a senha passada ou a primeira da lista (funcionalidade original)
    const senha = senhaSelecionada || this.senhaPreferencial[0];
  
    senha.operador = this.operador;
    senha.guiche = this.guiche;
    senha.status = '1';
    senha.horachamada = time;
    this.senhaOperadorPainel = senha;
  
    try {
      await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
      await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);
      console.log("Senha chamada:", senha);
    } catch (error) {
      console.error("Erro ao chamar senha preferencial:", error);
    } finally {
      this.spinner.hide();
    }
  }

  // Registra operador no sistema
  cadastrar(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.corretor;
      this.telaoperador = true;
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    this.senhaVerificar = [];
 
  
    for (let index = 0; index < this.senha.length; index++) {
       
      if (this.senha[index].operador == this.formulario.value.corretor){
         this.senhaVerificar.push(this.senha[index]);
      }
      
    }

  }

  
  // Registra operador convencional no sistema
  cadastrarConvencional(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.nome;
      this.guiche = this.formulario.value.guiche;
      this.telaoperador = true;
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    
    for (let index = 0; index < this.repetirSenha.length; index++) {
      
      if(this.repetirSenha[index].guiche === this.guiche) {
         this.senhaOperadorPainel = this.repetirSenha[index];
      }
      
    }
    
  
  
  }

  
  // Abre um modal para finalizar atendimento
  openModal(template:TemplateRef<any>, senha:DadosSenha){
    this.modalRef = this.modalService.show(template);
    this.senhaFinalizar = senha;
  }

  
  

  
  async finalizarConvencional() {
    let time = Date.now().toString();
    this.senhaFinalizar.finalatendimento = time;
    this.senhaFinalizar.status = '3';
    
    // Primeiro, salve a avaliação no banco de dados (Firebase)
    const duracaoAtendimento = this.calcularDuracao(this.senhaFinalizar);
  
    const avaliacao = {
      nomeOperador: this.operador,
      guiche: this.guiche,
      duracaoAtendimento: duracaoAtendimento,
      nota: null, // A nota pode ser preenchida mais tarde ou com valor padrão
    };
  
    const avaliacaoRef = ref(getDatabase(), 'avaliacoes/' + Date.now());
  
    try {
      // Navegar para a página de avaliação
      await this.router.navigate(['/avaliar'], {
        queryParams: {
          operador: this.operador,
          guiche: this.guiche,
          duracao: duracaoAtendimento,
          senha: this.senhaFinalizar.senha
        }
      });
  
      // Agora chamamos a função `finalizarSenhaChamadaConvencional` passando os parâmetros necessários
      const nota = 0; // Nota pode ser inicializada com valor 0 ou qualquer valor padrão
      await this.adminService.finalizarSenhaChamadaConvencional(this.senhaFinalizar, nota, duracaoAtendimento);
      
      this.modalRef?.hide(); // Fecha o modal após a navegação
  
    } catch (error) {
      console.error('Erro ao salvar avaliação: ', error);
    }
  }

  // Encerrar (Função ainda não implementada)
  encerrar(senha:DadosSenha){

    

  }
      
  // Navega para a página de avaliação
avaliar() {
  this.router.navigate(['/avaliar']); 
}
mostrarSenhasNaoAtendidas() {
  this.adminService.getSenhasGeradas(false).subscribe(senhas => {
    // Elimina duplicatas caso existam no banco de dados ou no retorno
    const senhasUnicas = Array.from(new Set(senhas.map(s => s.senha)))
      .map(senhaUnica => senhas.find(s => s.senha === senhaUnica)!);

    // Atribui a lista de senhas filtradas
    this.senha = senhasUnicas; // Para manter compatibilidade com o estado anterior
    this.senhasPreferenciais = senhasUnicas.filter(s => s.preferencial);
    this.senhasNaoPreferenciais = senhasUnicas.filter(s => !s.preferencial);

    console.log("Senhas Preferenciais:", this.senhasPreferenciais);
    console.log("Senhas Não Preferenciais:", this.senhasNaoPreferenciais);
  }, error => {
    console.error("Erro ao buscar senhas:", error);
  });
}

 // Método para marcar a senha como atendida e realizar a ação
atenderSenha(senha: DadosSenha) {
  senha.status = 'atendido'; // Marca a senha como atendida

  // Atualiza o status da senha no Firestore utilizando o AdminService
  this.adminService.updateSenha(senha.senhaid, { status: senha.status })
    .then(() => {
      alert(`Senha ${senha.senha} atendida com sucesso!`);

      // Atualiza a lista de senhas para refletir a alteração
      this.mostrarSenhas = false;
      this.senha = this.senha.filter(s => s.senhaid !== senha.senhaid);

      // Registra como finalizada no Firestore (opcional)
      senha.finalatendimento = Date.now().toString();
      this.adminService.salvaSenhafinalizada(senha);
    })
    .catch(error => {
      console.error("Erro ao atualizar o status da senha", error);
    });
}
// Método para calcular a duração do atendimento
calcularDuracao(senha: DadosSenha): string {
  const horaChamada = parseInt(senha.horachamada, 10);  // Hora de chamada
  const horaFinalizacao = parseInt(senha.finalatendimento, 10);  // Hora de finalização
  
  if (!horaChamada || !horaFinalizacao) {
    return '0 minutos';
  }

  const duracaoMs = horaFinalizacao - horaChamada; // Diferença em milissegundos
  const duracaoMinutos = Math.floor(duracaoMs); // Converte para minutos

  return `${duracaoMinutos} milisegundos`;
}



}


