import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
import { get, getDatabase, ref, set, update } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';
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
 
 //SETORES
 setoresDisponiveis: string[] = ['Atendimento', 'Financeiro', 'Suporte']; // Exemplo de setores
 setorSelecionado: string = '';
 senhasFiltradas: DadosSenha[] = []; // Senhas filtradas pelo setor


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
    private db: Database,
     private authService: AuthService
  ) {}


  ngOnInit(): void {
    // Verifica se o usuário está autenticado ao carregar o componente
  if (!this.authService.isUserAuthenticated()) {
    this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
  } else {
    this.formbuilder()
     // Carrega os setores disponíveis
  this.carregarSetores();}

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
      this.filtrarSenhasPorSetor();
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
      setor: ['', Validators.required],
      guiche: ['',[Validators.required, Validators.minLength(5)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

  // Filtra as senhas com base no setor selecionado
filtrarSenhasPorSetor() {
  if (!this.setorSelecionado) {
    console.warn('Nenhum setor selecionado.');
    return;
  }

  // Filtra as senhas geradas convencionalmente pelo setor
  this.senhaNormalNova = this.repetirSenha.filter(
    (senha) => senha.setor === this.setorSelecionado && senha.status === '0' && !senha.preferencial
  );

  this.senhaPreferencial = this.repetirSenha.filter(
    (senha) => senha.setor === this.setorSelecionado && senha.status === '0' && senha.preferencial
  );

  console.log('Senhas normais no setor:', this.senhaNormalNova);
  console.log('Senhas preferenciais no setor:', this.senhaPreferencial);
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
       this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
    })
     // Registra o momento da chamada da senha
  this.senhaOperadorPainel = senha;  // Armazena a senha chamada
  }
  
  // Chama uma senha normal convencional
  async chamarSenhaNormalConvencional(senhaSelecionada?: DadosSenha) {
    this.spinner.show();
    const time = Date.now().toString();
  
    // Usar a senha passada ou a primeira da lista
    const senha = senhaSelecionada || this.senhaNormalNova[0];
  
    senha.operador = this.operador;
    senha.guiche = this.guiche;
    senha.status = '1';
    senha.horachamada = time;
    this.senhaOperadorPainel = senha;
  
    const senhageradaPath = `avelar/senhagerada/${senha.senhaid}`;
    
  
    try {
      await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
      await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);
  
      // Remove dos caminhos especificados no Firebase
      await update(ref(this.db), {
        [senhageradaPath]: null,
      });
  
      console.log("Senha chamada e removida:", senha);
    } catch (error) {
      console.error("Erro ao chamar senha normal:", error);
    } finally {
      this.spinner.hide();
      this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
    }
  }
 
  // Chama uma senha preferencial convencional
  async chamarsenhapreferencial(senhaSelecionada?: DadosSenha) {
    this.spinner.show();
    const time = Date.now().toString();
  
    // Usar a senha passada ou a primeira da lista
    const senha = senhaSelecionada || this.senhaPreferencial[0];
  
    senha.operador = this.operador;
    senha.guiche = this.guiche;
    senha.status = '1';
    senha.horachamada = time;
    this.senhaOperadorPainel = senha;
  
    
    const senhageradaPath = `avelar/senhagerada/${senha.senhaid}`;

    try {
      await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
      await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);
  
      // Remove dos caminhos especificados no Firebase
      await update(ref(this.db), {
        [senhageradaPath]: null,
      });
  
      console.log("Senha chamada e removida:", senha);
    } catch (error) {
      console.error("Erro ao chamar senha preferencial:", error);
    } finally {
      this.spinner.hide();
      this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
    }
  }
// Carrega os setores do Firebase
async carregarSetores() {
  const setoresRef = ref(this.db, `avelar/setor`);
  const snapshot = await get(setoresRef);

  if (snapshot.exists()) {
    const setoresData = snapshot.val() as Record<string, { setor: string }>;
    this.setoresDisponiveis = Object.values(setoresData).map((item) => item.setor);
    console.log('Setores carregados:', this.setoresDisponiveis);
  } else {
    console.log('Nenhum setor encontrado no banco de dados.');
  }
}
  // Registra operador no sistema
  cadastrar(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.corretor;
      this.setorSelecionado = this.formulario.value.setor;
      this.telaoperador = true;
      this.filtrarSenhasPorSetor(); // Atualiza senhas após cadastro
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
    
     // Verifica se o setor foi selecionado
  if (!this.formulario.value.setor) {
    alert('Por favor, selecione um setor!');
    return; // Sai do método se o setor não foi selecionado
  }
  if (!this.formulario.value.guiche) {
    alert('Por favor, selecione um guichê!');
    return; // Sai do método se o guiche não foi selecionado
  }
  if (!this.formulario.value.nome) {
    alert('Por favor, escreva seu nome!');
    return; // Sai do método se o nome não foi escrito
  } 
    
    
    if(this.formulario.value){
      this.operador = this.formulario.value.nome;
      this.setorSelecionado = this.formulario.value.setor; 
      this.guiche = this.formulario.value.guiche;
      this.telaoperador = true;
      this.filtrarSenhasPorSetor();
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    
      // Filtra as senhas do operador atual
  this.senhaVerificar = [];

    for (let index = 0; index < this.repetirSenha.length; index++) {
      
      if(this.repetirSenha[index].guiche === this.guiche) {
         this.senhaOperadorPainel = this.repetirSenha[index];
      }
      
    }
    
  
  
  }

  
  // Abre um modal para avaliar e finalizar atendimento
  openModal(template:TemplateRef<any>, senha:DadosSenha){
    this.modalRef = this.modalService.show(template);
    this.senhaFinalizar = senha;
    this.notasDisponiveis = Array.from({ length: 10 }, (_, i) => i); 
  }

  
  

  
  async finalizarConvencional(senha: DadosSenha) {
    let time = Date.now().toString();
    senha.finalatendimento = time;
    senha.status = '3';
    console.log(senha.finalatendimento);
    this.senhaFinalizar = senha;
     // Abre o modal para que o operador insira a nota
  this.modalRef = this.modalService.show(this.modalTemplate);
  }

  // Encerrar (Função ainda não implementada)
  encerrar(senha:DadosSenha){

    

  }
      
  // Navega para a página de avaliação
/*avaliar() {
  this.router.navigate(['/avaliar']); 
}*/
mostrarSenhasNaoAtendidas() {
  console.log("Função chamada!");

  this.adminService.getSenhasGeradas().subscribe(
    (senhas) => {
      console.log('Senhas recebidas:', senhas);
      if (!senhas || senhas.length === 0) {
        console.warn('Nenhuma senha encontrada.');
        return;
      }

      // Elimina duplicatas baseado no campo 'senha'
      const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
        .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);
     

      // Filtra as senhas de acordo com o setor (guiche)
      const senhasDoSetor = senhasUnicas.filter(s => s.setor === this.setorSelecionado);
      console.log('Senhas do setor:', senhasDoSetor);

      // Atribui a lista de senhas filtradas
      this.senha = senhasDoSetor; // Lista de senhas do setor
      this.senhasPreferenciais = senhasDoSetor.filter((s) => s.preferencial);
      this.senhasNaoPreferenciais = senhasDoSetor.filter((s) => !s.preferencial);

      // Atualiza a flag para exibir as senhas
      this.mostrarSenhas = true;
    },
    (error) => {
      console.error('Erro ao buscar senhas:', error);
    }
  );
}




selecionarNota(nota: number) {
  this.notaSelecionada = nota;

}

 // Método para finalizar a senha com nota
 async finalizarComNota() {
console.log('Senha Finalizar:', this.senhaFinalizar);
console.log('Nota Selecionada:', this.notaSelecionada);
console.log('Operador:', this.operador);
console.log('Guichê:', this.guiche);
console.log('Senha Operador Painel:', this.senhaOperadorPainel);
  if (this.notaSelecionada === null) {
    alert('Por favor, selecione uma nota!');
    return;
  }

 
  // Garante que todos os campos da senha estão preenchidos
 this.senhaFinalizar.nota = this.notaSelecionada;
 const senhachamadaPath = `avelar/senhachamada/${this.senhaFinalizar.horachamada}`;

  try {
    // Salva as informações no banco de dados
    await this.adminService.salvaSenhaFinalizadaConvencional(this.senhaFinalizar);
    
    
 // Remove dos caminhos especificados no Firebase (apaga os dados da senha chamada)
    await update(ref(this.db), {
      [senhachamadaPath]: null,
    });
    
    console.log(`Senha com finalatendimento ${this.senhaFinalizar.senhaid} apagada com sucesso no caminho: ${senhachamadaPath}`);

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


