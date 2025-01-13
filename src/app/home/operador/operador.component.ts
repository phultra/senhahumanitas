import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, FormsModule,],
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
  
  
  // Nova propriedade para controle de avaliação
  exibirSelecaoNota: boolean = false;
  notasDisponiveis: number[] = Array.from({ length: 11 }, (_, i) => i); // 0 a 10
  notaSelecionada: number | null = null;
 
 
  // Array para armazenar as senhas geradas
  senhasPreferenciais: DadosSenha[] = [];
  senhasNaoPreferenciais: DadosSenha[] = [];
  
  //VARIÁVEL QUE CRIA FORMULARIO

   formulario!: FormGroup;

   senha: DadosSenha [] = [];
   senhaVerificar: DadosSenha[] =[];

   modalRef?: BsModalRef;
   @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
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
     // Registra o momento da chamada da senha
  this.senhaOperadorPainel = senha;  // Armazena a senha chamada
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
    this.notasDisponiveis = Array.from({ length: 10 }, (_, i) => i); // Gera os números de 0 a 9
  }

  
  

  
  async finalizarConvencional() {
    let time = Date.now().toString();
    this.senhaFinalizar.finalatendimento = time;
    this.senhaFinalizar.status = '3';
    
     // Abre o modal para que o operador insira a nota
  this.modalRef = this.modalService.show(this.modalTemplate);
  this.senhaFinalizar = this.senhaFinalizar; // Passa a senha para o modal
    
    const duracaoAtendimento = this.calcularDuracao(this.senhaFinalizar);
  
   /* const avaliacao = {
      nomeOperador: this.operador,
      guiche: this.guiche,
      duracaoAtendimento: duracaoAtendimento,
      nota: null, // A nota pode ser preenchida mais tarde ou com valor padrão
    };*/
  
    //const avaliacaoRef = ref(getDatabase(), 'avaliacoes/' + Date.now());
  
    /*try {
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
  */}

  // Encerrar (Função ainda não implementada)
  encerrar(senha:DadosSenha){

    

  }
      
  // Navega para a página de avaliação
/*avaliar() {
  this.router.navigate(['/avaliar']); 
}*/
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
// Método para calcular a duração do atendimento em milissegundos
calcularDuracao(senha: DadosSenha): string {
  const horaChamada = new Date(senha.horachamada);  // Hora de chamada como Data
  const horaFinalizacao = new Date(senha.finalatendimento);  // Hora de finalização como Data
  
  // Verificar se as datas são válidas
  if (isNaN(horaChamada.getTime()) || isNaN(horaFinalizacao.getTime())) {
    console.error('Erro: uma das datas não é válida');
    return 'corrigir';
  }

  const duracaoMs = horaFinalizacao.getTime() - horaChamada.getTime();  // Diferença em milissegundos

  // Console log para visualizar o cálculo
  console.log(`Hora chamada: ${horaChamada}`);
  console.log(`Hora finalização: ${horaFinalizacao}`);
  console.log(`Duração (ms): ${duracaoMs}`);

  return `${duracaoMs} milissegundos`;  // Retorna a diferença em milissegundos
}

selecionarNota(nota: number) {
  this.notaSelecionada = nota;

}

 // Método para finalizar a senha com nota
 async finalizarComNota() {
  if (this.notaSelecionada === null) {
    alert('Por favor, selecione uma nota!');
    return;
  }

  const time = Date.now().toString();

  // Garante que todos os campos da senha estão preenchidos
  this.senhaFinalizar.finalatendimento = time;
  this.senhaFinalizar.status = '3';
  this.senhaFinalizar.nota = this.notaSelecionada;

  if (!this.senhaFinalizar.guiche) {
    this.senhaFinalizar.guiche = this.guiche;
  }

  if (!this.senhaFinalizar.operador) {
    this.senhaFinalizar.operador = this.operador;
  }

  if (!this.senhaFinalizar.horachamada) {
    this.senhaFinalizar.horachamada = time
   }
  
 if (!this.senhaFinalizar.senha) {
    this.senhaFinalizar.senha = this.senhaOperadorPainel?.senha || 'Não informada';
  }

  if (!this.senhaFinalizar.senhaid) {
    this.senhaFinalizar.senhaid = this.senhaOperadorPainel?.senhaid || 'Não informada';
  }

  if (!this.senhaFinalizar.setor) {
    this.senhaFinalizar.setor = this.senhaOperadorPainel?.setor || 'Não informado';
  }

 // Calcula a duração do atendimento
 const duracaoAtendimento = this.calcularDuracao(this.senhaFinalizar);
  try {
    // Salva as informações no banco de dados
    await this.adminService.finalizarSenhaChamadaConvencional(
      this.senhaFinalizar,
      this.notaSelecionada,
      duracaoAtendimento
    );

    alert('Atendimento finalizado com sucesso!');
    
    // Esconde os botões após finalizar o atendimento
    this.mostrarSenhas = false;  
    this.modalRef?.hide(); // Fecha o modal
     // Recarrega a página
     location.reload();
  } catch (error) {
    console.error('Erro ao finalizar a senha:', error);
  }
}

}


